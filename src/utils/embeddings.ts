import { Doc } from "@/src/types/doc";

export async function retrieve(queryEmb: number[], k = 3) {
  // Llamamos al Remote Procedure Call (RPC) de Supabase
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmb,
    match_count: k
  });

  if (error) {
    console.error("Error retrieving documents:", error);
    return[];
  }

  // data ya viene ordenado y solo trae los K mejores resultados
  return data; 
}