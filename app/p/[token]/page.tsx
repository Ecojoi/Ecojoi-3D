import Studio from "@/app/studio";
export const metadata={title:"Amostra virtual · ECOJOI",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Preview({params}:{params:Promise<{token:string}>}){const {token}=await params;return <Studio publicToken={token}/>;}
