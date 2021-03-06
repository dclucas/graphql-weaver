import { GraphQLSchema } from 'graphql';
import { EndpointConfig } from '../config/weaving-config';
import { GraphQLClient } from '../graphql-client/graphql-client';
import { ExtendedSchema } from '../extended-schema/extended-schema';
import { Query } from '../graphql/common';
import { ExtendedSchemaTransformer, transformExtendedSchema } from '../extended-schema/extended-schema-transformer';
import { WeavingErrorConsumer } from '../config/errors';

/**
 * Part of the pipeline that transforms both the schema and queries/resolvers
 */
export interface PipelineModule extends SchemaPipelineModule, QueryPipelineModule {
}

export interface SchemaPipelineModule {
    transformSchema?(schema: GraphQLSchema): GraphQLSchema;
    transformExtendedSchema?(schema: ExtendedSchema): ExtendedSchema;

    /**
     * If defined, is called on each root schema. If the result of the defined method is undefined, the schema is left untouched.
     */
    getSchemaTransformer?(): ExtendedSchemaTransformer | undefined;
}

export interface QueryPipelineModule {
    /**
     * If defined, is called on a query executed by the proxy resolver
     */
    transformQuery?(node: Query): Query;
}

export function runQueryPipelineModule(module: QueryPipelineModule, query: Query) {
    if (module.transformQuery) {
        query = module.transformQuery(query);
    }

    return query;
}

export function runQueryPipeline(modules: QueryPipelineModule[], query: Query) {
    return modules.reduce((query, module) => runQueryPipelineModule(module, query), query);
}

export function runSchemaPipelineModule(module: SchemaPipelineModule, schema: ExtendedSchema) {
    if (module.transformExtendedSchema) {
        schema = module.transformExtendedSchema(schema);
    }
    if (module.transformSchema) {
        schema = schema.withSchema(module.transformSchema(schema.schema));
    }
    if (module.getSchemaTransformer) {
        const transformer = module.getSchemaTransformer();
        if (transformer) {
            schema = transformExtendedSchema(schema, transformer);
        }
    }
    return schema;
}

export function runSchemaPipeline(modules: SchemaPipelineModule[], schema: ExtendedSchema) {
    // TODO be more efficient by combining schema transformers if possible
    return modules.reduce((schema, module) => runSchemaPipelineModule(module, schema), schema);
}

export interface EndpointInfo {
    endpointConfig: EndpointConfig
    client: GraphQLClient
    schema: ExtendedSchema
}

export interface PreMergeModuleContext {
    /**
     * The user-provided configuration of the endpoint being processed
     */
    endpointConfig: EndpointConfig

    /**
     * The client to be used to execute queries against the original endpoint
     */
    client: GraphQLClient

    /**
     * Prepares a query written against the final schema to be run on the original schema
     */
    processQuery(query: Query): Query;

    /**
     * Can be used to log errors without aborting the whole weaving process
     */
    reportError: WeavingErrorConsumer
}

export interface PostMergeModuleContext {
    endpoints: PreMergeModuleContext[]
    reportError: WeavingErrorConsumer
}

export interface PipelineConfig {
    /**
     * Allows to alter the list of pipeline modules executed before the merge.
     * @param modules the original list of modules
     * @param context the pipeline context for the endpoint this pipeline is created for
     * @return the transformed list of pipeline modules
     */
    transformPreMergePipeline?(modules: PipelineModule[], context: PreMergeModuleContext): PipelineModule[];

    /**
     * Allows to alter the list of pipeline modules executed after the merge
     * @param modules the original lits of modules
     * @param context the pipeline context
     * @return the transformed list of pipeline modules
     */
    transformPostMergePipeline?(modules: PipelineModule[], context: PostMergeModuleContext): PipelineModule[];
}
