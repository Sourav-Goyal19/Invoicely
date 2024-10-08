import { UserData } from "@/types";
import { BranchFilter } from "./branch-filter";
import { DateFilter } from "./date-filter";
import { CategoryFilter } from "./category-filter";

interface FiltersProps {
  user?: UserData | null;
}

const Filters: React.FC<FiltersProps> = ({ user }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-2 items-center">
      {/* <BranchFilter user={user} /> */}
      <CategoryFilter user={user} />
      <DateFilter user={user} />
    </div>
  );
};

export default Filters;
