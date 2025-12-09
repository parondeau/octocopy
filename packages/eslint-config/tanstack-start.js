import { tanstackConfig } from "@tanstack/eslint-config";
import { config as baseConfig } from "./base.js";

export const config = [...baseConfig, ...tanstackConfig];
