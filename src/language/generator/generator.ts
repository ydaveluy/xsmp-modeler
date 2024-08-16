import type { AstNode, URI } from 'langium';

export type Task = () => Promise<void>;
export type TaskAcceptor = (task: Task) => void;
export interface XsmpGenerator {
     generate: (node: AstNode, projectUri: URI, acceptTask: TaskAcceptor) => void
     clean: (projectUri: URI) => void
}