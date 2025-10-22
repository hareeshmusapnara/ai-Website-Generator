"use client"
import React, { use, useEffect, useState } from 'react'
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

 const Prompt=`userInput: {userInput}

1. If the user input is explicitly asking to generate code, design, or HTML/CSS/JS output (e.g., “Create a landing page”, “Build a dashboard”, “Generate HTML Tailwind CSS code”), then:
- Generate a complete HTML Tailwind CSS code using Flowbite UI components.
- Use a modern design with **xBlue as the primary color theme**.
  - Only include the <body> content (do not add <head> or <title>).
  - Make it fully responsive for all screen sizes.
  - All primary components must match the theme color.
  - Add proper padding and margin for each element.
  - Components should be independent; do not connect them.
  - Use placeholders for all images:
    - Light mode: https://community.softbr.io/uploads/db910/original/2X/7/74e6e7c382d0f6f57773ca9478e6f6f8817a86a.jpeg
    - Dark mode: https://www.ciabky.com/wp-content/uploads/2015/12/placeholder-3.jpg
    - Add alt tag describing the image prompt.
  - Use the following libraries/components where appropriate:
    - FontAwesome icons (fa fa-)
    - Flowbite UI components: buttons, modals, forms, tables, tabs, alerts, cards, dialogs, dropdowns, accordions, etc.
    - Chart.js for charts & graphs
    - Swiper.js for sliders/carousels
    - Tippy.js for tooltips & popovers
  - Include interactive components like modals, dropdowns, and accordions.
  - Ensure proper spacing, alignment, hierarchy, and consistency.
  - Ensure charts are visually appealing and match the theme color.
  - Menu element options should be spread out and not connected.
  - Do not include broken links.
  - Do not add any extra text before or after the HTML code.

2. If the user input is **general text or greetings** (e.g. “Hi”, “Hello”, “How are you?”) **or does not explicitly ask to generate code**, then:
- Respond with a simple, friendly text message instead of generating any code.

Example:
- User: “Hi” » Response: “Hello! How can I help you today?”
- User: “Build a responsive landing page with Tailwind CSS” » Response: [Generate full HTML code as per instructions above]
`

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
    if(result.data?.chatMessages && result.data.chatMessages.length > 0){
     setMessages(result.data.chatMessages);
    }
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
            messages:[ {role:'user', content:Prompt?.replace('{userInput}',userInput)} ]
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

 useEffect(()=>{
  if(messages.length > 0 )
    SaveMessages();
  {

  }
 },[messages])

 const SaveMessages=async()=>{
       const result = await axios.put('/api/chats',{
           messages:messages,
           frameId:frameId
       });
       console.log(result);
 }

  
  return (
    <div>
      
      <PlaygroundHeader/>
      {/* ChatSection */}
      <div className='flex' >
       <ChatSection messages={messages??[]} onSend={(input:string)=>SendMessage(input)} loading={loading} />
      {/* WebsiteDesign */}
      <WebsiteDesign generatedCode={generatedCode?.replace('```','')}/>

      {/* Setting Section */}
      {/* <ElementSettingSection/> */}
      </div>

    </div>
  )
}

export default PlayGround
