import {
  BinType,
  type Bin,
  type BinFilter,
} from '@/features/waste-management/types';

interface LocationsSideBarProps {
  bins: Bin[];
  selectedBinId: number | null;
  searchQuery: string;
  activeTypeFilter: BinFilter;
  loading: boolean;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: BinFilter) => void;
  onBinSelect: (binId: number) => void;
  onLocateUser: () => void;
}

export default function LocationsSideBar({
  bins,
  selectedBinId,
  searchQuery,
  activeTypeFilter,
  loading,
  onSearchChange,
  onFilterChange,
  onBinSelect,
  onLocateUser,
}: LocationsSideBarProps) {
  const typeFilters: readonly BinFilter[] = [
    'All',
    BinType.RECYCLABLE,
    BinType.GENERAL,
    BinType.HAZARDOUS,
    BinType.ORGANIC,
  ];

  const formatFilterLabel = (filter: BinFilter) => {
    if (filter === 'All') {
      return 'All';
    }

    const lower = filter.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1).replace(/_/g, ' ');
  };

  return (
    <aside className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 focus:outline-none"
            placeholder="Search by location name"
          />
          <button
            onClick={onLocateUser}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white shadow-md transition hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Locating…' : '📍 Find me'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                activeTypeFilter === filter
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {formatFilterLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {bins.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-500">
            No locations match the current filters.
          </p>
        )}

        {bins.map((bin) => (
          <button
            key={bin.id}
            onClick={() => onBinSelect(bin.id)}
            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
              selectedBinId === bin.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {bin.name}
                </p>
                <p className={`text-xs ${bin.color}`}>{bin.type}</p>
              </div>
              <span className="text-xs font-semibold text-blue-600">
                {bin.distance}
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
