# @alistigo/logger

[![npm version](https://img.shields.io/npm/v/@alistigo/logger.svg?style=flat)](https://www.npmjs.com/package/@alistigo/logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

Shared pino-based logger for Alistigo apps and packages. Wraps pino with a singleton root logger and a `createLogger` factory for named child loggers.

## Install

```sh
pnpm add @alistigo/logger
```

## Usage

```ts
import { createLogger } from "@alistigo/logger";

const logger = createLogger("my-module");
logger.info("hello");
```
