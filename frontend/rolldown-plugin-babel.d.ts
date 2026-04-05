declare module "@rolldown/plugin-babel" {
  import type { PluginOption } from "vite";

  type BabelPluginOptions = {
    presets?: unknown[];
    plugins?: unknown[];
  };

  export default function babel(options?: BabelPluginOptions): PluginOption;
}
