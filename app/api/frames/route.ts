import { db } from "@/config/db";
import { chatTable, frameTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req:NextRequest){
  const {searchParams}=new URL(req.url);
  const frameId=searchParams.get('frameId');
  const projectId=searchParams.get('projectId');

    const frameResult = await db.select().from(frameTable)
    //@ts-ignore
    .where(eq(frameTable.frameId, frameId));
    //@ts-ignore
    const chatResult = await db.select().from(chatTable).where(eq(chatTable.frameId , frameId)) 

    const finalResult={
      ...frameResult[0],
      chatMessages:chatResult[0].chatMessage
    }

    return Response.json(finalResult);

}