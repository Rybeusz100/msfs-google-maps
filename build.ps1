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
cp server/airports.json dist/