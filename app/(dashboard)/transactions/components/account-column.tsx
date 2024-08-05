import { useOpenBranch } from "@/features/branches/hooks/use-edit-branch";

interface BranchColumnProps {
  branch: string;
  branchId: string;
}

const BranchColumn: React.FC<BranchColumnProps> = ({ branch, branchId }) => {
  const { onOpen } = useOpenBranch();
  const handleClick = () => {
    onOpen(branchId);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center cursor-pointer hover:underline"
    >
      {branch}
    </div>
  );
};

export default BranchColumn;
