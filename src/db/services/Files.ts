import { eq } from "drizzle-orm"
import { db } from "../client"
import { files } from "../Schema"


type FileInput = {
    name: string
    snippet_id: number | null
    path: string
    size: number
    type: 'image' | 'code' | 'template'
}

export const getFiles = async () => {

    return await db.select().from(files)
}

export const getFileBySnippetId = async (snippet_id: number) => {
    return await db.select().from(files).where(eq(files.snippet_id, snippet_id))
}


export const createFileRecord = async (input: FileInput) => {
    return await db.insert(files).values({
        name: input.name,
        path: input.path,
        snippet_id: input.snippet_id,
        size: input.size,
        type: input.type,
        created_at: new Date()
    }).returning()

}

export const deleteFileRecord = async (file_id: number) => {
    await db.delete(files).where(eq(files.id, file_id))
}

// export const updateFilePath = async (id: number, newPath: string) => {
//     await db
//         .update(files)
//         .set({ path: newPath })
//         .where(eq(files.id, id))
// }

export const updateFilePath = async (id: number, newPath: string, destination?: 'exports' | 'templates') => {
    const typeMap = { exports: 'code', templates: 'template' } as const
    await db
        .update(files)
        .set({
            path: newPath,
            ...(destination && { type: typeMap[destination] })
        })
        .where(eq(files.id, id))
}

export const getFileById = async (id: number) => {
    return await db
        .select()
        .from(files)
        .where(eq(files.id, id))
        .get()
}