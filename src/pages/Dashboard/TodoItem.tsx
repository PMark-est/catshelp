import React, { useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import { Button } from "@mui/material";

interface TodoItemProps {
  label: string;
  assignee: string;
  due: string;
  action: {
    label: string;
    redirect: string;
  };
  urgent: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({
  label,
  due,
  assignee,
  action,
  urgent,
}) => {
  const [checked, setChecked] = useState(false);
  const dateColor = urgent ? "text-red-400" : "text-slate-500";

  return (
    <tr className="pb-4">
      <td className="w-1/2 text-sm whitespace-normal align-middle">
        <div className="flex items-center gap-2">
          <Checkbox
            sx={{ padding: 0 }}
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span className={`${checked ? "line-through text-gray-400" : ""}`}>
            {label}
          </span>
        </div>
      </td>
      <td className={`text-left w-1/6 ${dateColor}`}>{due}</td>
      <td className="flex text-left gap-4 items-end">
        <object data="/cat.svg" width="30" height="30"></object>
         {assignee}
         </td>
      <td className="text-right align-middle">
        <a href={action.redirect} target="_blank" rel="noopener noreferrer">
          <Button variant="contained">{action.label}</Button>
        </a>
      </td>
    </tr>
  );
};

export default TodoItem;
