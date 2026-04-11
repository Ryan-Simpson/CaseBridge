import { useState } from 'react'

export default function FormField({ label, value, needsInput }) {
  const [editValue, setEditValue] = useState(value)
  const [isEditing, setIsEditing] = useState(false)

  if (needsInput) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
        <input
          type="text"
          value={isEditing ? editValue : ''}
          placeholder="Enter value..."
          onChange={(e) => {
            setIsEditing(true)
            setEditValue(e.target.value)
          }}
          className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-sm text-gray-800 placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-sm"
        />
      </div>
    )
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="text"
        readOnly
        value={value}
        className="w-full px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-sm text-gray-800 cursor-default shadow-sm"
      />
    </div>
  )
}
