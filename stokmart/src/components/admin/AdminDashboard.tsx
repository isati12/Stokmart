import React, { useState } from 'react';
import { Sidebar, AdminMenuKey } from './Sidebar';
import { AdminTopbar } from './AdminTopbar';
import { InventoryOverviewTab } from './InventoryOverviewTab';
import { TsbEngineTab } from './TsbEngineTab';
import { AnalyticsTab } from './AnalyticsTab';
import { RestockOrdersTab } from './RestockOrdersTab';
import { ProductManagementTab } from './ProductManagementTab';
import { SimulationTab } from './SimulationTab';
import { MasterDataTab } from './MasterDataTab';
import { CustomerOrdersTab } from './CustomerOrdersTab';
import { ReportsTab } from './ReportsTab';
import { LaravelExportModal } from './LaravelExportModal';

export const AdminDashboard: React.FC = () => {
  const [currentMenu, setCurrentMenu] = useState<AdminMenuKey>('overview');
  const [targetTsbProductId, setTargetTsbProductId] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLaravelModalOpen, setIsLaravelModalOpen] = useState(false);

  const handleNavigateToTsb = (productId: string) => {
    setTargetTsbProductId(productId);
    setCurrentMenu('tsb-engine');
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-950 text-slate-100 flex flex-row">
      {/* Fixed Static Modern Sidebar */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={setCurrentMenu}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area - Locked header with independent scrolling on main only */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        {/* Pinned Topbar */}
        <AdminTopbar
          currentMenu={currentMenu}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSelectMenu={setCurrentMenu}
          onOpenLaravelModal={() => setIsLaravelModalOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Route Content - Independent View Scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 w-full max-w-full min-w-0 animate-fadeIn scrollbar-thin">
          {currentMenu === 'overview' && (
            <InventoryOverviewTab onNavigateToTsb={handleNavigateToTsb} />
          )}

          {currentMenu === 'analytics' && <AnalyticsTab />}

          {currentMenu === 'master-data' && <MasterDataTab />}

          {currentMenu === 'customer-orders' && <CustomerOrdersTab />}

          {currentMenu === 'tsb-engine' && (
            <TsbEngineTab initialProductId={targetTsbProductId} />
          )}

          {currentMenu === 'tsb-compare' && (
            <TsbEngineTab initialProductId={targetTsbProductId} />
          )}

          {currentMenu === 'inventory' && (
            <InventoryOverviewTab onNavigateToTsb={handleNavigateToTsb} />
          )}

          {currentMenu === 'restock-po' && <RestockOrdersTab />}

          {currentMenu === 'products' && <ProductManagementTab />}

          {currentMenu === 'reports' && <ReportsTab />}

          {currentMenu === 'simulation' && <SimulationTab />}
        </main>
      </div>

      {/* Laravel Project Code Export Modal */}
      <LaravelExportModal
        isOpen={isLaravelModalOpen}
        onClose={() => setIsLaravelModalOpen(false)}
      />
    </div>
  );
};
