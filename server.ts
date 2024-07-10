import "reflect-metadata";
import fastify from 'fastify';
import mercurius from 'mercurius';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { config } from 'dotenv';
import { google } from 'googleapis';// Import renderPlaygroundPage function
import { buildSchema } from 'type-graphql';
import {ContactResolver} from './src/GraphContacts/contactsResolvers';
import {CalendarResolver} from './src/GraphCalendar/calendarResolvers';

config();

const app : FastifyInstance = fastify();

// Importing the credentials for the user
const credentials = {
    cliet_id : process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uris: process.env.REDIRECT_URI
};

// Creating auth object
const authClient = new google.auth.OAuth2(
    credentials.cliet_id,
    credentials.client_secret,
    credentials.redirect_uris,
);

const buildGraphQLSchema = async() => {
    const schema = await buildSchema({
        resolvers: [ContactResolver, CalendarResolver],
        validate: false,
    });
    return schema;
};


// Initiate the auth flow
app.get('/auth', async(req: FastifyRequest, reply: FastifyReply) => { 
    const authUrl = authClient.generateAuthUrl({
        access_type: 'offline',
        scope:
        [
            'https://www.googleapis.com/auth/calendar.readonly', 
            'https://www.googleapis.com/auth/contacts.readonly',
            'https://www.googleapis.com/auth/contacts',

        ]
    });
    reply.redirect(authUrl);
})

// This route handles the callback from Google after the user authorizes the application.
app.get('/oauth2callback', async (request: FastifyRequest, reply: FastifyReply) => {
   try{  
     const query = request.query as any; // Generalized the type
      const code = query.code as string; 
      const { tokens } = await authClient.getToken(code);
      authClient.setCredentials(tokens); // Updates the credentials
      reply.redirect("http://localhost:3000/graphiql"); 
   }
    catch (error){
        app.log.error(error);
        reply.status(500).send('Authentication failed');
      }
  });

  buildGraphQLSchema().then(Schema => {
    app.register(mercurius, {
        schema: Schema,
        context: () => ({authClient}),
        graphiql: true
    });
  });

  app.listen({
    port: 3000,
    host: '127.0.0.1'
  },
(err, adress) => {
    if(err){
        app.log.error(err);
        process.exit(1);     
    }
    console.log(`Server listening on ${adress}`);
});
