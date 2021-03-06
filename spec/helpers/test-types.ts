import {
    GraphQLBoolean, GraphQLEnumType, GraphQLID, GraphQLInputObjectType, GraphQLInputType, GraphQLInt, GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString
} from 'graphql';
import { arrayToObject, flatMap, mapValues, objectFromKeys } from '../../src/utils/utils';

export namespace testTypes {
    export const carType = new GraphQLObjectType({
        name: 'Car',
        fields: {
            color: { type: GraphQLString },
            doorCount: { type: GraphQLInt }
        }
    });

    export const personType = new GraphQLObjectType({
        name: 'Person',
        fields: {
            name: { type: GraphQLString },
            isCool: { type: GraphQLBoolean },
            nationality: { type: GraphQLString },
        }
    });

    const continents = ['Europe', 'NorthAmerica', 'SouthAmerica', 'Asia', 'Australia', 'Antarctica', 'Africa'];

    export const continentType = new GraphQLEnumType({
        name: 'Continent',
        values: objectFromKeys(continents, key => ({}))
    });

    export const countryType = new GraphQLObjectType({
        name: 'Country',
        fields: {
            id: { type: GraphQLID},
            identCode: { type: GraphQLString },
            isoCode: { type: GraphQLString },
            description: { type: GraphQLString },
            continent: { type: continentType }
        }
    });

    export const countryFilterType = new GraphQLInputObjectType({
        name: 'CountryFilter',
        fields: {
            identCode_in: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
            continent: { type: continentType }
        },

    });


    export const personFilterType = new GraphQLInputObjectType({
        name: 'PersonFilter',
        fields: {
            isCool: { type: GraphQLBoolean }
        },

    });

    export const personOrderType = createOrderByType('Person', ['name', 'isCool']);
    export const countryOrderType = createOrderByType('Country', ['isoCode', 'description', 'continent']);
}

function createOrderByType(typeName: string, fields: string[]) {
    return new GraphQLEnumType({
        name: `${typeName}OrderBy`,
        values: objectFromKeys(flatMap(fields, field => [field + '_ASC', field + '_DESC']), key => ({})),
    });
}
