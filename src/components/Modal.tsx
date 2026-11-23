import { useEffect,useRef,type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
 return <dialog ref={ref} onCancel={onClose} aria-labelledby="dialog-title"><header className="modal-head"><h2 id="dialog-title">{title}</h2><button className="icon-btn" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></header>{children}</dialog>;
}
