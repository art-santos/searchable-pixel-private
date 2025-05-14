export interface CLIOptions {
    hasBlog: boolean;
    contentPath: string;
    usesTailwind: boolean;
    usesAppRouter: boolean;
    domain: string;
    agentId?: string;
    agentSecret?: string;
}
export declare function runCLI(): Promise<void>;
