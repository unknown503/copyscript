export enum TokenType {
    Number,
    String,
    Identifier,
    Let,
    Const,
    Fun,
    If,
    Else,
    While,
    For,
    Switch,

    BinaryOperator,
    Equals,
    Comma,
    Dot,
    Colon,
    Semicolon,
    OpenQuotation, // "
    CloseQuotation, // "
    OpenParen, // (
    CloseParen, // )
    OpenBrace, // {
    CloseBrace, // }
    OpenBracket, // [
    CloseBracket, //]
    EOF,

    EqualTo, // ==
    DifferentThan, // !=
    MoreThan, // >
    MoreThanOrEqualTo, // >=
    LessThan, // <
    LessThanOrEqualTo, // <=
}