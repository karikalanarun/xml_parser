const { Just, Nothing } = require("crocks/Maybe");
const { ifElse } = require("crocks/logic");
const { chain, map, bichain } = require("crocks/pointfree");
const R = require("ramda");

// combinators
// type Parser a = string -> Maybe {result: a, remainder: String}
// either -> (Parser a, Parser b) -> Parser (a|b)
const either = (p1, p2) => string =>
  R.compose(
    bichain(() => p2(string), Just),
    p1
  )(string);

// both :: Parser a -> Parser b -> Parser [a, b]
const both = R.curry((p1, p2) =>
  R.compose(
    chain(res1 =>
      R.compose(
        chain(res2 => result([res1.result, res2.result], res2.remainder)),
        p2
      )(R.prop("remainder", res1))
    ),
    p1
  )
);

const seq = R.curry((...parsers) => parsers.reduce(both));

const result = R.curry((result, remainder) => Just({ result, remainder }));

// chainP :: Parser a -> (a -> Parser b) -> Parser b
const chainP = R.curry((parser, step, string) =>
  parser(string).chain(({result, remainder}) =>
    step(result)(remainder)
  )
);

// parse 0 or more occurrences (always succeeds, e.g. with [] if no matches)
// many0 :: Parser a -> Parser [a]
const many0 = R.curry(parser => string =>
  chainP(
    parser,
    x => chainP(
      many0(parser),
      xs => result([x, ...xs])
    )
  )(string).either(() => result([])(string), Just)
);

// parse 1 or more occurrences
// many1 :: Parser a -> Parser [a]
const many1 = R.curry(parser => string =>
  chainP(
    parser,
    x => chainP(
      many0(parser),
      xs => result([x, ...xs])
    )
  )(string)
);

// parseChar :: string -> Parser string
const parseChar = char => string =>
  string[0] === char ? result(char, string.slice(1)) : Nothing();

const parseString = literal => string =>
  string.startsWith(literal)
    ? result(literal, string.slice(literal.length))
    : Nothing();

const parseTagOpener = parseChar("<");

const parseTagCloser = parseChar(">");

const parseClosingTagOpener = parseString("</");

const idenfierResult = wholeString => matched =>
  result(matched, wholeString.slice(matched.length));

const parseIdentifier = string =>
  R.compose(
    ifElse(R.identity, idenfierResult(string), Nothing),
    R.prop(0),
    R.match(/^[a-z0-9]+/)
  )(string);

const tagAction = type => result => {
  return {
    type,
    lexeme: result[0].join("") + result[1],
    node_name: result[0][1]
  };
};

const openTagAction = tagAction("open_tag");

const closeTagAction = tagAction("close_tag");

const wholeTagAction = result => {
  return { node_name: result[0].node_name, children: [], attributes: [] };
};

const parseOpenTag = R.compose(
  map(R.over(R.lensProp("result"), openTagAction)),
  seq(parseTagOpener, parseIdentifier, parseTagCloser)
);

const parseCloseTag = R.compose(
  map(R.over(R.lensProp("result"), closeTagAction)),
  seq(parseClosingTagOpener, parseIdentifier, parseTagCloser)
);

// const children = either(many((string) => parseWholeTag(string)), )

const parseWholeTag = R.compose(
  map(R.over(R.lensProp("result"), wholeTagAction)),
  both(parseOpenTag, parseCloseTag)
);

module.exports = parseWholeTag;
