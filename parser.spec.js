const parse = require("./parser");
const Maybe = require("crocks/Maybe");

console.log(Maybe.Nothing().constructor);

describe("parse", () => {
  it("should be a function", () => {
    expect(parse).toBeDefined();
    expect(parse.constructor).toBe(Function);
  });
  it("should parse <tag></tag> and send valid AST", () => {
    // Arrange
    const text = "<tag></tag>";
    const expectedAST = {
      node_name: "tag",
      attributes: [],
      children: []
    };
    const success = jest.fn();
    const failed = jest.fn();
    // Act
    const result = parse(text);

    // Assert
    expect(result.constructor).toBe(Maybe);
    result.either(failed, success);
    expect(failed).not.toBeCalled();
    expect(success.mock.calls.length).toBe(1);
    expect(success.mock.calls[0][0].result).toMatchObject(expectedAST);
  });
  it("should parse <tag></tag> and send valid AST", () => {
    // Arrange
    const text = "<tag><child></child></tag>";
    const expectedAST = {
      node_name: "tag",
      attributes: [],
      children: [
        {
          node_name: "child",
          attributes: [],
          children: []
        }
      ]
    };
    const success = jest.fn();
    const failed = jest.fn();
    // Act
    const result = parse(text);

    // Assert
    expect(result.constructor).toBe(Maybe);
    result.either(failed, success);
    expect(failed).not.toBeCalled();
    expect(success.mock.calls.length).toBe(1);
    expect(success.mock.calls[0][0].result).toMatchObject(expectedAST);
  });
});
