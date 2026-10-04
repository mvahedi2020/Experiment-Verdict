import {useEffect,useRef,type ReactNode} from 'react'
export default function Dialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;ref.current?.showModal();return ()=>{previous?.focus()}},[])
 return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={e=>{e.preventDefault();onClose()}}><header><h2 id="dialog-title">{title}</h2><button aria-label="Close dialog" onClick={onClose}>×</button></header>{children}</dialog>
}
