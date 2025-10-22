"use client"
import React, { useEffect, useState } from 'react'
import PlaygroundHeader from '../_components/PlaygroundHeader'
import ChatSection from '../_components/ChatSection'
import WebsiteDesign from '../_components/WebsiteDesign'
import ElementSettingSection from '../_components/ElementSettingSection'
import { useParams, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { is } from 'drizzle-orm'

export type Frame={
   projectId:string,
   frameId:string,
   designCode:string,
   chatMessages:Messages[]
}

export type Messages={
  role:string,
  content:string
}

function PlayGround() {
  const {projectId}=useParams();
  const params= useSearchParams();
  const frameId=params.get('frameId');
  const [frameDetails, setFrameDetails]=useState<Frame>();
  const [loading,setLoading]=useState(false);
  const [messages,setMessages]=useState<Messages[]>([]);
  const [generatedCode,setGeneratedCode]=useState<any>();

  useEffect(()=>{
     frameId && GetFrameDetails()
},[frameId])
  
 const GetFrameDetails= async()=>{
  try {
    const result= await axios.get('/api/frames?frameId='+frameId+'&projectId='+projectId)
    console.log(result.data);
    setFrameDetails(result.data);
  } catch (error) {
    console.error('Error fetching frame details:', error);
  }
 }

 const SendMessage=async(userInput:string)=>{
       setLoading(true);

       //add user message to chat section
       setMessages((prev:any)=>[
        ...prev,
          {role:'user', content:userInput}
         
       ])
       const result=await fetch ('/api/ai-model',{
        method:"POST",
        body:JSON.stringify({
            messages:[ {role:'user', content:userInput} ]
        })
       });

      const reader=result.body?.getReader(); 
      const decoder=new TextDecoder();

      let aiResponse='';
      let isCode=false;

      while(true)
      {
        //@ts-ignore
        const {done,value}=await reader?.read();
       if(done)break;

        const chunk=decoder.decode(value,{stream:true});
        aiResponse+=chunk
        // check if AI Start sending code
        if(!isCode && aiResponse.includes('```html')){
          isCode=true;
          const index=aiResponse.indexOf("```html")+7;
          const initialCodeChunk=aiResponse.slice(index);
          setGeneratedCode((prev:any)=>prev+initialCodeChunk);
        } else if(isCode){
          setGeneratedCode((prev:any)=>prev+chunk);
        }
        // After Streaming End
       

      }
       if(!isCode){
          setMessages((prev:any)=>[
            ...prev,
            {role:'assistant', content:aiResponse}
          ])
        } else{
           setMessages((prev:any)=>[
            ...prev,
            {role:'assistant', content:'Your Code Is Ready!'}
          ])
        }
      setLoading(false);

 }


  
  return (
    <div>
      
      <PlaygroundHeader/>
      {/* ChatSection */}
      <div className='flex' >
       <ChatSection messages={messages??[]} onSend={(input:string)=>SendMessage(input)}/>
      {/* WebsiteDesign */}
      <WebsiteDesign/>

      {/* Setting Section */}
      {/* <ElementSettingSection/> */}
      </div>

    </div>
  )
}

export default PlayGround
