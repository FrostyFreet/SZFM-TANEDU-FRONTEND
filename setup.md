# Setup.md

Rövid, egyértelmű telepítési és indítási útmutató helyi fejlesztéshez.

## 1. Követelmények

* Git
* JDK 21
* Node.js 18+ (npm)
* PostgreSQL (ajánlott 14+; a projekt `Alma1234` jelszót használja a példa .env-ben)
* (opcionális) VS Code / pgAdmin / WSL2

## 2. Backend .env (másold a backend gyökérbe)

```env
JWT_SECRET=a2e3d1385b00ad01cf6b1fd3f01adf20a7d863650dc907f80b7922055684c344
JWT_EXPIRATION=3600000
DB_HOST=localhost
DB_PASSWORD=Alma1234
DB_USERNAME=postgres
DB_NAME=SZFM
```

## 3. Frontend .env (másold a frontend gyökérbe)

```env
VITE_API_BASE_URL="http://localhost:8080/api"
```

## 4. PostgreSQL telepítése

### Windows

* Töltsd le és telepítsd a PostgreSQL.
* Indítsd el a szolgáltatást és jelentkezz be `psql`-lal vagy pgAdmin-nel.


## 5. Adatbázis létrehozása és jogosultságok (psql parancsok)

Jelentkezz be `psql`-lal (pl. `sudo -u postgres psql`) és futtasd:

```sql
Erre nem tudom szükség van-e
ALTER USER postgres WITH PASSWORD 'Alma1234';
CREATE DATABASE "SZFM";
GRANT ALL PRIVILEGES ON DATABASE "SZFM" TO postgres;
```

Ellenőrizd, hogy a backend `.env`-ben `DB_HOST=localhost` szerepel, ha helyileg futtatod a Postgres-t.
## 7. Backend indítása

```bash
Indítsd el IntelliJ-vel
```

## 7. Frontend indítása

```bash
cd C:\React\szfm-tanedu-frontend
npm install
npm run dev
```

A Vite dev szerver alapból a `5173` porton fut. A `VITE_API_BASE_URL`-nek `http://localhost:8080/api`-ra kell mutatnia.






