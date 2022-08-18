if (Test-Path -path dist) {
    rmdir -r dist
}

mkdir dist

cd server
cargo build --release
cd ..

cp server/target/release/server.exe dist/
cp server/Rocket.toml dist/
cp server/SimConnect.dll dist/
cp -r server/airports.json dist/

cd front
npm run build
cd ..

cp -r front/build/ dist/front

New-Item -Path "dist" -Name "api_key.txt"