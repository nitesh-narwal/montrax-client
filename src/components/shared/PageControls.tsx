import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';

interface PageControlsProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

/** Reusable pager for any endpoint returning the shared PagedResponse<T> shape. */
export function PageControls({ currentPage, totalPages, hasNext, hasPrevious, onPageChange }: PageControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={!hasPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            onClick={() => hasPrevious && onPageChange(currentPage - 1)}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink isActive>{currentPage + 1}</PaginationLink>
        </PaginationItem>
        <span className="text-sm text-muted-foreground px-2 self-center">of {totalPages}</span>
        <PaginationItem>
          <PaginationNext
            className={!hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            onClick={() => hasNext && onPageChange(currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
