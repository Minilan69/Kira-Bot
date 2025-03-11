function logger(log, wait) {
    var terminal = typeof process.stdout.cursorTo === "function"
    if(terminal && wait) {
        process.stdout.write(log)
        process.stdout.cursorTo(0)
    }
    else console.log(log)
}

module.exports = function checkDependencies() {
    return new Promise((resolve, reject) => {
        logger("Vérifications des modules...", true)
        var fs;
        try {
            fs = require("fs")
        }
        catch (err) {
            console.log(`\x1b[31m%s\x1b[0m`, "Erreur de modules ; veuillez exécuter la commande 'npm i'.")
            process.exit(1)
        }
        let packages1 = fs.readFileSync("./package.json")
        let packages = JSON.parse(packages1)
        let packagesErrMap = new Map()
        packages = packages.dependencies
        let packagesList = Object.keys(packages)
        let numtotal = packagesList.length
        let compteur = 0
        packagesList.forEach(pkg => {
            compteur++
            logger("Vérification des modules (" + `${compteur}/${numtotal})...`, true)
            let pkgVersion = packages[pkg].replace("^", "")
            if (fs.existsSync("./node_modules/" + pkg)) {
                let manifest = fs.readFileSync("./node_modules/" + pkg + "/package.json")
                manifest = JSON.parse(manifest)
                if (manifest.version === pkgVersion) {
                    if (compteur === numtotal) next(numtotal, packagesErrMap)
                    return;
                }
                else packagesErrMap.set(pkg, { name: pkg, version: pkgVersion, type: "VERSION_NOT_EQUAL", actualVersion: manifest.version })
                if (compteur === numtotal) next(numtotal, packagesErrMap)
            }
            else {
                packagesErrMap.set(pkg, { name: pkg, version: pkgVersion, type: "NOT_FOUND" })
                if (compteur === numtotal) next(numtotal, packagesErrMap)
            }
        })
        async function next(total, erroreds) {
            if(erroreds.size === 0) {
              console.log("Tous les modules sont présents, démarrage...")
              resolve()
            }
            else {
              let errorMsg = "Erreur de dépendances :\n"
              erroreds.forEach(pkg => {
                if(pkg.type === "NOT_FOUND") errorMsg += `- ${pkg.name} : Non trouvé (version requise : ${pkg.version})\n`
                if(pkg.type === "VERSION_NOT_EQUAL") errorMsg += `- ${pkg.name} : Version non correspondante\n    Requis : ${pkg.version}\n    Installé : ${pkg.actualVersion}\n`
              })
              errorMsg += "\nVeuillez exécuter la commande 'npm i'."
              console.log(`\x1b[31m%s\x1b[0m`, errorMsg)
              process.exit(1)
            }
          }
    })
}