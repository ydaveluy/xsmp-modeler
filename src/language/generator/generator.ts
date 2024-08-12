import type { AstNode, URI } from 'langium';

export interface XsmpGenerator<T extends AstNode>
{

     getGenerationTasks: (node: T, projectUri: URI) => Array<Promise<void>>

}