export interface CodemodRuleMeta {
    id: string;
    title: string;
    description: string;
    v5Pattern: string;
    v6Replacement: string;
    docsUrl?: string;
}
export interface CodemodRule extends CodemodRuleMeta {
    apply: (source: string) => string;
}
