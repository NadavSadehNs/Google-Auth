import { Resolver, Query, Mutation, Ctx, Arg } from "type-graphql";
import { AddContactInput, Contact, DeleteContactInput, DeleteContactResponse, PhoneNumberFilterInput } from "./contactsSchema";
import { google } from "googleapis";
import { AuthClient } from "google-auth-library";

@Resolver(Contact)
export class ContactResolver {
    @Query(() => [Contact])
    async contacts(
        // Injects the auth const
        @Ctx() ctx: { authClient: any },
        // Optional filter
        @Arg("filter", () => PhoneNumberFilterInput, { nullable: true }) filter?: PhoneNumberFilterInput
    ): Promise<Contact[]> {
        try {
            // Initialized the Google People API service
            const peopleService = google.people({ version: 'v1', auth: ctx.authClient });
            const response = await peopleService.people.connections.list({
                resourceName: 'people/me',
                pageSize: 10,
                personFields: 'names,emailAddresses,phoneNumbers,addresses', // Corrected field name
            });
            // Imports the connections from response data. If null => [].
            const connections = response.data.connections || [];
            
            // Maps each connection from connections to a Contact object.
            const contacts = connections.map(connection => {
                const name = connection.names?.[0]?.displayName || "No Name";
                const email = connection.emailAddresses?.[0]?.value || "No Email";
                const phoneNumber = connection.phoneNumbers?.[0]?.value || "No Phone Number";
                const address = connection.addresses?.[0]?.formattedValue || "No Address";
                const id = connection.resourceName?.split('/')[1];
                //console.log(JSON.stringify(connection));
                return { name, email, phoneNumber, address, id};
            });

            // If filter exists, apply it
            if (filter?.startsWith) {
                const startWithFilter = filter.startsWith;
                const filteredContacts = contacts.filter(contact =>
                    contact.phoneNumber?.startsWith(startWithFilter)
                );
                return filteredContacts;
            }

            return contacts;

        } catch (error) {
            console.error("Error fetching contacts:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch contacts: ${error.message}`);
            } else {
                throw new Error("Failed to fetch contacts: Unknown error occurred");
            }
        }
    }


    @Mutation(() => Contact)
    async addContact(
        @Ctx() ctx: { authClient: any },
        @Arg("input") input: AddContactInput
    ): Promise<Contact> {
        try {
            // Check if input is provided and has name
            if (!input || !input.name) {
                throw new Error("Input object with 'name' field is required.");
            }

            const peopleService = google.people({ version: 'v1', auth: ctx.authClient });
            
            // Prepare the contact data to be inserted
            const nameParts = input.name.split(" ");
            const requestBody = {
                names: [
                    {
                        givenName: nameParts[0], // Assuming first part is given name
                        familyName: nameParts.slice(1).join(" "), // Remaining parts as family name
                    }
                ],
                emailAddresses: [{ value: input.email }],
                phoneNumbers: [{ value: input.phoneNumber }],
            };
            
            // Make API request to create contact
            const response = await peopleService.people.createContact({
                requestBody,
            });

            // Parse the response and return the newly created contact
            const createdContact = response.data;

            return {
                name: `${createdContact.names?.[0]?.givenName || ""} ${createdContact.names?.[0]?.familyName || ""}`,
                email: createdContact.emailAddresses?.[0]?.value || "No Email",
                phoneNumber: createdContact.phoneNumbers?.[0]?.value || "No Phone Number",
                address: createdContact.addresses?.[0]?.formattedValue || "No Address",
            };

        } catch (error) {
            console.error("Error adding contact:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to add contact: ${error.message}`);
            } else {
                throw new Error("Failed to add contact: Unknown error occurred");
            }
    }
}

@Mutation(() => DeleteContactResponse)
async DeleteContactResponse(
    @Ctx() ctx: { authClient: any},
    @Arg("input") input: DeleteContactInput
): Promise<DeleteContactResponse>{
    try{
        if(!input || !input.id){
            throw new Error("Input object with 'id' field is required.");
        }

        const peopleService = google.people({version: 'v1', auth: ctx.authClient});

        const response = await peopleService.people.get({
            resourceName: `people/${input.id}`,
            personFields: 'name, emailAddresses, phoneNumbers, adresses',
        });

        await peopleService.people.deleteContact({
            resourceName: `people/${input.id}`,
        });

        // Construct the response
        const deletedContact = {
            name: response.data.names?.[0]?.displayName || "No Name",
            email: response.data.emailAddresses?.[0]?.value || "No Email",
            phoneNumber: response.data.phoneNumbers?.[0]?.value || "No Phone Number",
            address: response.data.addresses?.[0]?.formattedValue || "No Address",
            id: input.id,
        };

        return {
            message: `Contact with ID ${input.id} has been successfully deleted.`,
            deletedContact,
        };
    }
    catch(error) {
        console.error("Error deleting contact:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to delete contact: ${error.message}`);
            } else {
                throw new Error("Failed to delete contact: Unknown error occurred");
            }
    }
}


}

