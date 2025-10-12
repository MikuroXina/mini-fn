/**
 * This package provides virtual DOM works.
 *
 * @packageDocumentation
 * @module
 */

import { type Exists, newExists, runExists } from "./exists.ts";
import type { Apply2Only, Hkt2 } from "./hkt.ts";
import * as Option from "./option.ts";
import { type Decoder, mapDecoder } from "./serial.ts";

const textSymbol = Symbol("DomText");
/**
 * Plain text object.
 */
export type Text = Readonly<{
    type: typeof textSymbol;
    /**
     * A plain string to show. A renderer must escape that the text to be rendered correctly.
     */
    text: string;
}>;
export const isText = <T>(dom: Dom<T>): dom is Text => dom.type === textSymbol;
/**
 * Creates a new plain text object.
 *
 * @param text - A plain string to show.
 * @returns The new text object.
 */
export const text = (text: string): Text => ({ type: textSymbol, text });

const tagSymbol = Symbol("DomTag");
/**
 * Enclosing tag element object such as `<div>...</div>`.
 */
export type Tag<T> = Readonly<{
    type: typeof tagSymbol;
    /**
     * Name of tag such as `div`.
     */
    tagName: string;
    /**
     * Identifier for virtual DOM. When updating the actual DOM, the identifier of elements will be used for efficient updates if defined.
     */
    virtualId: string | undefined;
    /**
     * Configuration of the tag.
     */
    facts: FactsOrganization<T>;
    /**
     * Enclosed children objects.
     */
    children: readonly Dom<T>[];
    /**
     * Namespace of the tag, or none if empty.
     */
    namespace: string;
    /**
     * Numbers of descendants.
     */
    descendantsCount: number;
}>;
export const isNode = <T>(dom: Dom<T>): dom is Tag<T> => dom.type === tagSymbol;
/**
 * Creates a new tag object.
 *
 * @param tagName - The name of the tag such as `div`.
 * @param namespace - The namespace of the tag such as `http://www.w3.org/2000/svg`.
 * @param virtualId - The identifier for virtual DOM. When updating the actual DOM, the identifier of elements will be used for efficient updates if defined. It should be unique by its content and should not be an index of items.
 * @param facts - Enumeration of event handlers, styles, properties and attributes.
 * @param children - Enclosing items of thee tag.
 * @returns The new tag object.
 */
export const tag =
    (tagName: string, namespace = "") =>
    (virtualId?: string) =>
    <T>(...facts: Fact<T>[]) =>
    (...children: Dom<T>[]): Tag<T> => ({
        type: tagSymbol,
        tagName: noScript(tagName),
        virtualId,
        facts: organizeFacts(facts),
        children,
        namespace,
        descendantsCount: children.length +
            children.reduce((acc, curr) => acc + descendantsCount(curr), 0),
    });

const mapSymbol = Symbol("DomMap");
/**
 * Message mapping object. Type parameter `A` will be existential quantified.
 */
export type MapT<T, A> = Readonly<{
    type: typeof mapSymbol;
    /**
     * Maps an message from `A` to `T`.
     */
    mapper: (msg: A) => T;
    /**
     * Source virtual DOM object that emits messages of type `A`.
     */
    dom: Dom<A>;
    /**
     * Numbers of descendants.
     */
    descendantsCount: number;
}>;
export interface MapTHkt extends Hkt2 {
    readonly type: MapT<this["arg2"], this["arg1"]>;
}
/**
 * Message mapping object, but the type parameter `A` is existential quantified. You need to use `runMap` function to extract the value `MapT<T, A>`.
 */
export type Map<T> = Exists<Apply2Only<MapTHkt, T>>;
export const isMap = <T>(dom: Dom<T>): dom is Map<T> =>
    (dom as unknown as { type: symbol }).type === mapSymbol;
/**
 * Creates a new mapping object.
 *
 * @param mapper - A function that maps from `A` to `T`.
 * @param dom - A source object that emits messages of type `A`.
 * @returns The new mapping object.
 */
export const map = <A, T>(mapper: (msg: A) => T) => (dom: Dom<A>): Map<T> =>
    newExists<Apply2Only<MapTHkt, T>, A>({
        type: mapSymbol,
        mapper,
        dom,
        descendantsCount: descendantsCount(dom) + 1,
    }) as unknown as Map<T>;
/**
 * Extracts the internal record from a map object.
 *
 * @param runner - A continued function to receive the record.
 * @param map - A map object.
 * @returns The return value of `runner`.
 */
export const runMap = <T, R>(
    runner: <A>(msg: MapT<T, A>) => R,
): (map: Map<T>) => R => runExists(runner);

const lazySymbol = Symbol("DomLazy");
/**
 * Lazy evaluating object.
 */
export type Lazy<T> = {
    readonly type: typeof lazySymbol;
    /**
     * The referencing objects used by `thunk`. These references are used to determine which `Lazy` is needed to rerender.
     */
    readonly refs: WeakSet<NonNullable<unknown>>;
    /**
     * The rendered virtual DOM if did.
     */
    cache: Option.Option<Dom<T>>;
    /**
     * The rendering function which has references of `refs`.
     */
    readonly thunk: () => Dom<T>;
};
export const isLazy = <T>(dom: Dom<T>): dom is Lazy<T> =>
    dom.type === lazySymbol;
/**
 * Creates a new lazy render object.
 *
 * @param body - A rendering body to be lazily evaluated.
 * @param params - Parameters of `body` that are used to check whether they are updated by a renderer.
 * @returns The new lazy render object.
 */
export const lazy =
    <A extends NonNullable<unknown>[], T>(body: (...params: A) => Dom<T>) =>
    (...params: A): Lazy<T> => ({
        type: lazySymbol,
        refs: new WeakSet([body, ...params] as NonNullable<unknown>[]),
        cache: Option.none(),
        thunk: () => body(...params),
    });

/**
 * A virtual DOM object that returning messages of type `T`.
 */
export type Dom<T> = Text | Tag<T> | Map<T> | Lazy<T>;

/**
 * Gets the number of descendants of a virtual DOM object.
 *
 * @param dom - A target virtual DOM object.
 * @returns The number od descendants.
 */
export const descendantsCount = <T>(dom: Dom<T>): number =>
    isMap(dom)
        ? runExists<Apply2Only<MapTHkt, T>, number>((map) =>
            map.descendantsCount
        )(dom)
        : dom.type === tagSymbol
        ? dom.descendantsCount
        : 0;

/**
 * A payload of `Handler`, the decoded event message of event handlers.
 */
export type HandlerPayload<T> = {
    /**
     * The passing custom value.
     */
    message: T;
    /**
     * Whether the renderer should stop propagation of this event.
     */
    stopPropagation: boolean;
    /**
     * Whether the renderer should prevent default behavior of this event.
     */
    preventDefault: boolean;
};
/**
 * An event handler that passing custom value of type `T`. It is equivalent to a `Decoder` of `HandlerPayload<T>`.
 */
export type Handler<T> = Decoder<HandlerPayload<T>>;

/**
 * The `Functor` implementation for `Handler<_>`.
 */
export const mapHandler =
    <T, U>(mapper: (msg: T) => U) => (handler: Handler<T>): Handler<U> =>
        mapDecoder((payload: HandlerPayload<T>): HandlerPayload<U> => ({
            ...payload,
            message: mapper(payload.message),
        }))(handler);

const eventSymbol = Symbol("FactEvent");
/**
 * An event handler of a `Fact`.
 */
export type Event<T> = {
    type: typeof eventSymbol;
    /**
     * The name of the event.
     */
    key: string;
    /**
     * The handler for the event.
     */
    value: Handler<T>;
};
/**
 * Creates an event handler of a fact.
 *
 * @param key - A name of event such as `click`, `mouseup` and so on.
 * @param handler - An event handler that decodes values of type `T`.
 * @returns The new fact.
 */
export const on = (key: string) => <T>(handler: Handler<T>): Event<T> => ({
    type: eventSymbol,
    key,
    value: handler,
});

const styleSymbol = Symbol("FactStyle");
/**
 * An applying style of a `Fact`.
 */
export type Style = {
    type: typeof styleSymbol;
    /**
     * The name of the CSS property.
     */
    key: string;
    /**
     * The value of the CSS property.
     */
    value: string;
};
/**
 * Creates an applying style of a fact.
 *
 * @param key - A name of the CSS property.
 * @param value - A value of the CSS property.
 * @returns The new fact.
 */
export const style = (key: string) => (value: string): Style => ({
    type: styleSymbol,
    key,
    value,
});

const propSymbol = Symbol("FactProp");
/**
 * A property configuration of a fact for JavaScript API.
 */
export type Prop = {
    type: typeof propSymbol;
    /**
     * The property name of the element in JavaScript.
     */
    key: string;
    /**
     * The property value of the element in JavaScript.
     */
    value: string;
};
/**
 * Creates a new property configuration for JavaScript API. `key` and `value` are escaped for preventing from XSS attack.
 *
 * @param key - A property name of the element.
 * @param value - A property value of the element.
 * @returns The new fact.
 */
export const property = (key: string) => (value: string): Prop => ({
    type: propSymbol,
    key: noInnerHtmlOrFormAction(key),
    value: noJavaScriptOrHtmlUri(value),
});

const attributeSymbol = Symbol("FactAttribute");
/**
 * A specifying attribute of a fact.
 */
export type Attribute = {
    type: typeof attributeSymbol;
    /**
     * The namespace of the tag such as `http://www.w3.org/2000/svg`.
     */
    namespace: string;
    /**
     * The name of the attribute such as `alt`.
     */
    key: string;
    /**
     * The value of the attribute.
     */
    value: string;
};
/**
 * Creates a new specifying attribute with the key and value.
 *
 * @param key - A name of the attribute such as `alt`.
 * @param namespace - A namespace of the tag such as `http://www.w3.org/2000/svg`.
 * @param value - A value of the attribute.
 * @returns The new fact.
 */
export const attribute =
    (key: string, namespace = "") => (value: string): Attribute => ({
        type: attributeSymbol,
        namespace,
        key: noOnOrFormAction(key),
        value: noJavaScriptOrHtmlUri(value),
    });

/**
 * A fact used on `tag` to declare its event handlers, styles, properties and attributes.
 */
export type Fact<T> = Readonly<Event<T> | Style | Prop | Attribute>;

/**
 * An organized facts to interpret by a renderer.
 */
export type FactsOrganization<T> = {
    /**
     * The event handlers by its event name.
     */
    events: Record<string, Handler<T>>;
    /**
     * The style specification for the tag.
     */
    styles: Record<string, string>;
    /**
     * The JavaScript properties for the element object.
     */
    props: Record<string, string>;
    /**
     * The HTML/XML attributes for the node.
     */
    attributes: Record<string, string>;
};

/**
 * The `Functor` implementation for a `Fact<_>`.
 */
export const mapFact =
    <T, U>(mapper: (msg: T) => U) => (attr: Fact<T>): Fact<U> =>
        attr.type === eventSymbol
            ? on(attr.key)(mapHandler(mapper)(attr.value))
            : attr;

/**
 * Organizes the declared facts of a tag.
 *
 * @param facts - Declared facts to be organized.
 * @returns The facts organization.
 */
export const organizeFacts = <T>(
    facts: readonly Fact<T>[],
): FactsOrganization<T> => {
    const appendClass = (
        obj: Record<string, string>,
        key: string,
        newClass: string,
    ): void => {
        const classes = obj[key];
        obj[key] = classes ? `${classes} ${newClass}` : newClass;
    };

    const ret: FactsOrganization<T> = {
        events: {},
        styles: {},
        props: {},
        attributes: {},
    };
    for (const attr of facts) {
        if (attr.type === propSymbol) {
            if (attr.key === "className") {
                appendClass(ret.props, attr.key, attr.value);
            } else {
                ret.props[attr.key] = attr.value;
            }
            continue;
        }
        if (attr.type === attributeSymbol && attr.key === "class") {
            appendClass(ret.attributes, attr.key, attr.value);
            continue;
        }
        const keyByType: Record<
            Fact<T>["type"],
            keyof FactsOrganization<T>
        > = {
            [eventSymbol]: "events",
            [styleSymbol]: "styles",
            [propSymbol]: "props",
            [attributeSymbol]: "attributes",
        };
        ret[keyByType[attr.type]][attr.key] = attr.value;
    }
    return ret;
};

/**
 * Prohibits a `script` tag and replaces it with `p`.
 *
 * @param tag - A name of a tag.
 * @returns The censored tag name.
 */
export const noScript = (tag: string): string =>
    tag.toLowerCase() === "script" ? "p" : tag;
/**
 * Prohibits an attribute name `on*` and `formaction` and replaces it with a custom data attribute `data-*`.
 *
 * @param key - An attribute name.
 * @returns The censored attribute name.
 */
export const noOnOrFormAction = (key: string): string => {
    const lowered = key.toLowerCase();
    if (lowered.startsWith("on") || lowered === "formaction") {
        return `data-${key}`;
    }
    return key;
};
/**
 * Prohibits a property name `innerHTML` and `formAction` of a DOM element and replaces it with a custom data attribute `data-*`.
 *
 * @param key - A property name.
 * @returns The censored property name.
 */
export const noInnerHtmlOrFormAction = (key: string): string =>
    key === "innerHTML" || key === "formAction" ? `data-${key}` : key;
const matchesSubstring = (value: string) => (target: string): boolean => {
    const matchedLenByPos = new Array(value.length);
    matchedLenByPos[0] = 0;
    for (let i = 1; i < value.length; ++i) {
        matchedLenByPos[i] = matchedLenByPos[i - 1];
        if (value[matchedLenByPos[i]] === target[matchedLenByPos[i]]) {
            matchedLenByPos[i] += 1;
        }
    }
    return matchedLenByPos[value.length - 1] === value.length - 1;
};
/**
 * Prohibits a value of attribute or property if it contains a substring of JavaScript/HTML noted URI.
 *
 * @param value - A value of attribute or property.
 * @returns The censored value.
 */
export const noJavaScriptOrHtmlUri = (value: string): string =>
    ["javascript:", "data:text/html;", "data:text/html,"].some(
            matchesSubstring(value),
        )
        ? ""
        : value;
