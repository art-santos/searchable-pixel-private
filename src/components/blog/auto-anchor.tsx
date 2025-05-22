'use client'

import React, { ComponentProps } from 'react'

// Simple slugify function
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
    .trim()                   // Trim whitespace
}

export function H2(props: ComponentProps<'h2'>) {
  const id = props.id || 
    (typeof props.children === 'string' 
      ? slugify(props.children) 
      : undefined)
  
  return <h2 id={id} {...props} />
}

export function H3(props: ComponentProps<'h3'>) {
  const id = props.id || 
    (typeof props.children === 'string' 
      ? slugify(props.children) 
      : undefined)
  
  return <h3 id={id} {...props} />
}

export function H4(props: ComponentProps<'h4'>) {
  const id = props.id || 
    (typeof props.children === 'string' 
      ? slugify(props.children) 
      : undefined)
  
  return <h4 id={id} {...props} />
} 