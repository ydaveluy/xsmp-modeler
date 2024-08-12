import { AstNode, URI } from "langium";


export interface XsmpGenerator<T extends AstNode> 
{

     getGenerationTasks(node: T, projectUri: URI): Promise<void>[] 

}