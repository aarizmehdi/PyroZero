declare module '*.sites-assets.json' {
  const assets: Record<string,{body:string;type:string}>;
  export default assets;
}
