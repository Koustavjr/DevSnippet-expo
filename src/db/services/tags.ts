import { and, eq } from "drizzle-orm"
import { db } from "../client"
import { snippet_tags, tags } from "../Schema"

type tagsInpu = {
    name: string
}


export const addTagToSnippet = async (snippetId: number, tagName: string) => {
    let tag = await db.select().from(tags).where(eq(tags.name, tagName)).get()

    if (!tag) {
        const result = await db.insert(tags).values({ name: tagName }).returning()
        tag = result[0]
    }

    await db.insert(snippet_tags).values({ snippet_id: snippetId, tag_id: tag.id })
}

export const removeTag = async (snippet_id: number, tag_id: number) => {
    await db.delete(snippet_tags).where(and(eq(snippet_tags.snippet_id, snippet_id),
        eq(snippet_tags.tag_id, tag_id)))
}


export const getTagBySnippetId = async (snippetId: number) => {
    return await db.select().from(tags).where(eq(tags.id, snippetId))
}