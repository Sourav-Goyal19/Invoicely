"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useDeleteBranch } from "@/features/branches/api/use-delete-branch";
import { useOpenBranch } from "@/features/branches/hooks/use-edit-branch";
import { useConfirm } from "@/hooks/use-confirm";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { useSession } from "next-auth/react";

interface ActionsProps {
  id: string;
}

const Actions: React.FC<ActionsProps> = ({ id }) => {
  const { onOpen } = useOpenBranch();
  const { data } = useSession();
  const deleteMutation = useDeleteBranch(id, data?.user?.email!);
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this branch"
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate();
    }
  };

  return (
    <DropdownMenu>
      <ConfirmDialog />
      <DropdownMenuTrigger asChild>
        <Button className="size-8 p-0" variant={"ghost"}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={false}
          onClick={() => {
            onOpen(id);
          }}
        >
          <Edit className="mr-2 size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={deleteMutation.isPending}
          onClick={handleDelete}
        >
          <Trash className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
