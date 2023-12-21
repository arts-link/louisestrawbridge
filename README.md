# Setup
- Install git submodules  
```bash
git submodule init
git submodule update
```

- Install hugo  
```bash
brew install hugo
```

- add `node_modules` to .gitignore  

- install javascript pacages
```bash
npm install
```

- build the site
```bash
rm -rf public # for a full clean install remove 
hugo --gc # add --gc for full garbage collection
```

- run the site
```bash
hugo serveer --disableFastRender # enable for full rebuilds on change
```