import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class CalendarEvent{
    @Field({ nullable: true})
    summary?: string;

    @Field({ nullable: true})
    start?: string;
    
    @Field({ nullable: true})
    end?: string;

    @Field({ nullable: true})
    location?: string;

    @Field({ nullable: true})
    description?: string;

}