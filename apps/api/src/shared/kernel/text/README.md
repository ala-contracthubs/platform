# shared/kernel/text

CONTEXT-FREE BoundedText(min,max) value-object FACTORY only; each context declares its own RejectionReason=BoundedText(50,500), ChangeRequest=BoundedText(50,2000), VideoInstructions=BoundedText(0,1000), InternalNote=BoundedText(0,4000), MessageBody=BoundedText(0,4000) in its own domain
