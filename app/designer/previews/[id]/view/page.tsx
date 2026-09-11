import Studio from "@/app/studio";
export default async function View({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Studio mode="view" designId={id}/>;}
