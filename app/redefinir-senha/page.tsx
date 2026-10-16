import PasswordRecovery from "@/app/password-recovery";
export const metadata={title:"Redefinir senha · ECOJOI Studio 3D",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function ResetPassword({searchParams}:{searchParams:Promise<{token?:string}>}){
 const params=await searchParams;
 return <PasswordRecovery mode="confirm" token={typeof params.token==="string"?params.token:""}/>;
}
