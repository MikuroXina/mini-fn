import type { Optical } from "../optical.js";
import type { Option } from "../option.js";

export type Prism<State, Part> = Optical<State, Option<Part>, Part, State>;
