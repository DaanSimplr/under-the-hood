import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { MDXComponents } from "mdx/types";

/**
 * Compiles an MDX string at build time (Server Component) and renders it with
 * the given components. No MDX code ships to the browser.
 */
export async function renderMdx(source: string, components: MDXComponents) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    development: false,
  });
  return <Content components={components} />;
}
