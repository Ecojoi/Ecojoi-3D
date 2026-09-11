import Studio from "@/app/studio";
export default async function Edit({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Studio mode="edit" designId={id}/>;}
