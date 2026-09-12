import Studio from "./studio";
import LoginForm from "./login-form";
import {getEcojoiUser} from "./ecojoi-auth";
export const dynamic="force-dynamic";
export default async function Home() { return await getEcojoiUser()?<Studio />:<LoginForm/>; }
