import exp from "constants";
import { ObjectType,InputType, Field } from "type-graphql";

@ObjectType()
export class Contact{
    @Field({nullable: true})
    name?: string;

    @Field({nullable: true})
    phoneNumber?: string;

    @Field({nullable: true})
    email?: string;

    @Field({nullable: true})
    address?: string;

    @Field({nullable: true})
    id?: string;
}

@InputType()
export class PhoneNumberFilterInput{
    @Field({nullable: true})
    startsWith?: string;
}

@InputType()
export class AddContactInput{
    @Field({nullable: true})
    name?: string;

    @Field({nullable: true})
    phoneNumber?: string;

    @Field({nullable: true})
    email?: string;
}

@InputType()
export class DeleteContactInput{
    @Field()
    id?: string;
}

@ObjectType()
export class DeleteContactResponse{
    @Field()
    message?: string;

    @Field(() => Contact, {nullable: true})
    deletedContact?: Contact;
}