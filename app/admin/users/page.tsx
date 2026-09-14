import {getEcojoiUser,isEcojoiAdmin} from '@/app/ecojoi-auth';
import LoginForm from '@/app/login-form';
import UsersAdmin from './users-admin';
export const dynamic='force-dynamic';
export default async function Page(){
 const user=await getEcojoiUser();
 if(!user)return <LoginForm/>;
 if(!isEcojoiAdmin(user))return <main className="users-admin"><section className="panel"><h1>Acesso exclusivo do administrador</h1><a href="/">Voltar aos designs</a></section></main>;
 return <UsersAdmin/>;
}
