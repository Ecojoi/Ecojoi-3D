import LoginForm from "../login-form";
import {requireChatGPTUser} from "../chatgpt-auth";
export const dynamic="force-dynamic";
async function Activation(){await requireChatGPTUser("/ativar");return <LoginForm mode="activate"/>;}
export default function Page(){return <Activation/>;}
