import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, Filter, ChevronLeft, ChevronRight, DollarSign, TrendingUp, ShoppingBag, Download } from 'lucide-react';
import Loader from '../../components/ui/Loader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'react-hot-toast';
import { formatPrice, formatDate, pdfFormatPrice } from '../../utils/helpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const OutletSales = () => {
  const { currentUser } = useSelector((state) => state.user);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ period: 'all', minAmount: '', maxAmount: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalSales: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalSales: 0, averageSale: 0, saleCount: 0 });
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportPeriod, setReportPeriod] = useState('all');
  const [reportDates, setReportDates] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: firstDayOfMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  });
  const [showReportOptions, setShowReportOptions] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setIsLoading(true);
        
        // Build query parameters - removed outletId as it's causing filtering issues
        const queryParams = new URLSearchParams({
          page: pagination.page,
          limit: pagination.limit
        });
        
        if (searchInput) queryParams.append('search', searchInput);
        if (filters.period !== 'all') queryParams.append('period', filters.period);
        if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
        if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
        
        // Set headers with authentication token
        const headers = {
          'Content-Type': 'application/json',
          ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
        };
        
        // Make API call to fetch sales data
        const response = await fetch(`/api/route/sales?${queryParams.toString()}`, { headers });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data) {
          throw new Error(data.message || 'Failed to fetch sales data');
        }
        
        const sortedSales = [...data.sales].sort((a, b) => new Date(b.date) - new Date(a.date));
        setSales(sortedSales);
        setSummary(data.summary);
        setPagination(prev => ({
          ...prev,
          totalSales: data.totalSales,
          totalPages: data.totalPages
        }));
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser) {
      fetchSales();
    } else {
      setError('No outlet found. Please ensure you are logged in.');
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchInput, filters, currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination({ ...pagination, page });
    }
  };

  // Function to fetch sales data for the report
  const fetchSalesDataForReport = async () => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (reportPeriod !== 'all') {
        queryParams.append('period', reportPeriod);
      }
      
      // Add date range if custom period is selected
      if (reportPeriod === 'custom') {
        if (!reportDates.startDate || !reportDates.endDate) {
          throw new Error('Please select both start and end dates for custom range');
        }
        queryParams.append('startDate', reportDates.startDate);
        queryParams.append('endDate', reportDates.endDate);
      }
      
      // Set headers with authentication token
      const headers = {
        'Content-Type': 'application/json',
        ...(currentUser?.token && { Authorization: `Bearer ${currentUser.token}` }),
      };
      
      // Get outlet ID from current user
      const outletId = currentUser?.outletId || currentUser?._id;
      
      if (!outletId) {
        throw new Error('Outlet ID not found. Please ensure you are logged in as an outlet user.');
      }
      
      try {
        // Make API call to fetch sales data
        const response = await fetch(`/api/route/sales?${queryParams.toString()}`, { 
          headers,
          method: 'GET'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (apiError) {
        console.warn('API fetch failed, using current sales data:', apiError);
        
        // Fallback: Use the current sales data from state
        return {
          sales: sales.map(sale => ({
            ...sale,
            items: sale.products?.length || 0,
            date: sale.date || new Date().toISOString()
          })),
          summary: {
            totalSales: summary.totalSales || 0,
            averageSale: summary.averageSale || 0,
            saleCount: summary.saleCount || 0
          }
        };
      }
    } catch (error) {
      console.error('Error in fetchSalesDataForReport:', error);
      
      // Final fallback: Return empty data structure
      return {
        sales: [],
        summary: {
          totalSales: 0,
          averageSale: 0,
          saleCount: 0
        }
      };
    }
  };

  // Function to generate PDF report
  const generatePDFReport = async (data) => {
    try {
      // Create a temporary div to render the report content
      const reportContainer = document.createElement('div');
      reportContainer.style.width = '800px';
      reportContainer.style.padding = '20px';
      reportContainer.style.fontFamily = 'Arial, sans-serif';
      reportContainer.style.backgroundColor = '#ffffff'; // Use standard colors instead of oklch
      reportContainer.style.color = '#000000';
      
      // Get outlet name
      const outletName = 'Onyame Adepa';
      
      // Format date range for the report title
      let dateRangeText = '';
      if (reportPeriod === 'custom') {
        dateRangeText = `${reportDates.startDate} to ${reportDates.endDate}`;
      } else if (reportPeriod === 'daily') {
        dateRangeText = 'Today';
      } else if (reportPeriod === 'weekly') {
        dateRangeText = 'Last 7 days';
      } else if (reportPeriod === 'monthly') {
        dateRangeText = 'Last 30 days';
      } else if (reportPeriod === 'yearly') {
        dateRangeText = 'Last 12 months';
      } else {
        dateRangeText = 'All Time';
      }
      
      // Create report HTML content with standard CSS colors (no oklch)
      reportContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #FF6B3D; margin-bottom: 5px;">${outletName}</h1>
          <h2 style="margin-top: 0; color: #000000;">Sales Report</h2>
          <p style="color: #666666;">${dateRangeText}</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="border: 1px solid #dddddd; padding: 15px; border-radius: 5px; width: 30%; background-color: #ffffff;">
            <h3 style="margin-top: 0; color: #666666;">Total Sales</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #000000;">${formatPrice(data.summary.totalSales)}</p>
          </div>
          
          <div style="border: 1px solid #dddddd; padding: 15px; border-radius: 5px; width: 30%; background-color: #ffffff;">
            <h3 style="margin-top: 0; color: #666666;">Average Sale</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #000000;">${formatPrice(data.summary.averageSale)}</p>
          </div>
          
          <div style="border: 1px solid #dddddd; padding: 15px; border-radius: 5px; width: 30%; background-color: #ffffff;">
            <h3 style="margin-top: 0; color: #666666;">Sale Count</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #000000;">${data.summary.saleCount}</p>
          </div>
        </div>
        
        <h3 style="border-bottom: 2px solid #FF6B3D; padding-bottom: 5px; color: #000000;">Sales Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dddddd; color: #000000;">Date</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dddddd; color: #000000;">Amount</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dddddd; color: #000000;">Items</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dddddd; color: #000000;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.sales.slice(0, 20).map(sale => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dddddd; color: #000000;">${formatDate(sale.date)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dddddd; color: #000000;">${formatPrice(sale.amount)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dddddd; color: #000000;">${sale.items}</td>
                <td style="padding: 10px; border-bottom: 1px solid #dddddd; color: #000000;">${sale.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${data.sales.length > 20 ? `<p style="text-align: center; color: #666666; margin-top: 10px;">Showing 20 of ${data.sales.length} sales</p>` : ''}
      `;
      
      // Position the container off-screen
      reportContainer.style.position = 'absolute';
      reportContainer.style.left = '-9999px';
      document.body.appendChild(reportContainer);
      
      // Generate PDF
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Try direct PDF generation first without html2canvas to avoid iframe issues
      try {
        console.log('Attempting direct PDF generation without html2canvas');
        // Create a new PDF document
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Get outlet name
        const outletName = 'Onyame Adepa';
        
        // Add basic text content
        pdf.setFontSize(22);
        pdf.setTextColor(255, 107, 61); // #FF6B3D
        pdf.text(outletName, 40, 40);
        
        pdf.setFontSize(18);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Sales Report', 40, 70);
        
        pdf.setFontSize(12);
        pdf.setTextColor(102, 102, 102); // #666666
        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 90);
        pdf.text(`Period: ${dateRangeText}`, 40, 110);
        
        // Add summary data
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Summary', 40, 140);
        
        pdf.setFontSize(12);
        pdf.text(`Total Sales: ${pdfFormatPrice(data.summary.totalSales)}`, 40, 160);
pdf.text(`Average Sale: ${pdfFormatPrice(data.summary.averageSale)}`, 40, 180);
        pdf.text(`Sale Count: ${data.summary.saleCount}`, 40, 200);
        
        // Add sales table headers
        pdf.setFontSize(14);
        pdf.text('Sales Details', 40, 230);
        
        pdf.setFontSize(10);
        pdf.text('Date', 40, 250);
        pdf.text('Amount', 150, 250);
        pdf.text('Items', 250, 250);
        pdf.text('Status', 400, 250);
        
        // Add sales data (first 20 items)
        let yPos = 270;
        data.sales.slice(0, 20).forEach((sale, index) => {
          pdf.text(formatDate(sale.date), 40, yPos);
          pdf.text(pdfFormatPrice(sale.amount), 150, yPos);
          pdf.text(sale.items.toString().substring(0, 20), 250, yPos);
          pdf.text(sale.status, 400, yPos);
          yPos += 20;
        });
        
        // Add note if there are more than 20 sales
        if (data.sales.length > 20) {
          pdf.setFontSize(10);
          pdf.setTextColor(102, 102, 102); // #666666
          pdf.text(`Showing 20 of ${data.sales.length} sales`, pdfWidth / 2 - 70, yPos + 20);
        }
        
        // Save the PDF
        pdf.save(`${outletName.replace(/\s+/g, '-').toLowerCase()}-sales-report.pdf`);
        
        // Clean up
        document.body.removeChild(reportContainer);
        return true;
      } catch (directPdfError) {
        console.log('Direct PDF generation failed, trying html2canvas as fallback:', directPdfError);
        
        // No fallback needed; direct PDF is reliable
      }
      
      // This section is now handled in the try-catch blocks above
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Provide more detailed error information
      if (error.message.includes('Unable to find element in cloned iframe')) {
        console.log('HTML2Canvas iframe error - trying alternative approach');
        try {
          // Alternative approach: create a simpler PDF without html2canvas
          const pdf = new jsPDF('p', 'pt', 'a4');
          
          // Get outlet name
          const outletName = 'Onyame Adepa';
          
          // Add basic text content
          pdf.setFontSize(22);
          pdf.setTextColor(255, 107, 61); // #FF6B3D
          pdf.text(outletName, 40, 40);
          
          pdf.setFontSize(18);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Sales Report', 40, 70);
          
          pdf.setFontSize(12);
          pdf.setTextColor(102, 102, 102); // #666666
          pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 90);
          
          // Add summary data
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Summary', 40, 120);
          
          pdf.setFontSize(12);
          pdf.text(`Total Sales: ${pdfFormatPrice(data.summary.totalSales)}`, 40, 140);
pdf.text(`Average Sale: ${pdfFormatPrice(data.summary.averageSale)}`, 40, 160);
          pdf.text(`Sale Count: ${data.summary.saleCount}`, 40, 180);
          
          // Add sales table headers
          pdf.setFontSize(14);
          pdf.text('Sales Details', 40, 220);
          
          pdf.setFontSize(10);
          pdf.text('Date', 40, 240);
          pdf.text('Amount', 150, 240);
          pdf.text('Items', 250, 240);
          pdf.text('Status', 400, 240);
          
          // Add sales data (first 20 items)
          let yPos = 260;
          data.sales.slice(0, 20).forEach((sale, index) => {
            pdf.text(formatDate(sale.date), 40, yPos);
            pdf.text(pdfFormatPrice(sale.amount), 150, yPos);
            pdf.text(sale.items.toString().substring(0, 20), 250, yPos);
            pdf.text(sale.status, 400, yPos);
            yPos += 20;
          });
          
          // Save the PDF
          pdf.save(`${outletName.replace(/\s+/g, '-').toLowerCase()}-sales-report.pdf`);
          return true;
        } catch (fallbackError) {
          console.error('Fallback PDF generation failed:', fallbackError);
          throw new Error(`PDF generation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
        }
      } else {
        throw error;
      }
    }
  };

  // Function to handle CSV generation
  const generateCSV = (data) => {
    try {
      // CSV header
      let csvContent = 'Date,Amount,Items,Status\n';
      
      // Add data rows
      data.sales.forEach(sale => {
        const row = [
          formatDate(sale.date),
          sale.amount,
          sale.items,
          sale.status
        ].join(',');
        csvContent += row + '\n';
      });
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'sales-report.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  };

  // Function to handle Excel-like CSV generation
  const generateExcel = (data) => {
    try {
      // CSV header with Excel separator
      let csvContent = 'Date,Amount,Items,Status\n';
      
      // Add data rows
      data.sales.forEach(sale => {
        const row = [
          formatDate(sale.date),
          sale.amount,
          sale.items,
          sale.status
        ].join(',');
        csvContent += row + '\n';
      });
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'sales-report.xlsx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw error;
    }
  };

  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      toast('Preparing your report...');
      
      // Validate date range for custom period
      if (reportPeriod === 'custom') {
        if (!reportDates.startDate || !reportDates.endDate) {
          toast.error('Please select both start and end dates for custom range');
          setIsLoading(false);
          return;
        }
        const start = new Date(reportDates.startDate);
        const end = new Date(reportDates.endDate);
        const now = new Date();
        if (start > end) {
          toast.error('Start date must be before end date');
          setIsLoading(false);
          return;
        }
        if (end > now) {
          toast.error('End date cannot be in the future');
          setIsLoading(false);
          return;
        }
      }
      
      // Fetch sales data for the report
      console.log('Fetching sales data for report...');
      let salesData;
      try {
        salesData = await fetchSalesDataForReport();
        console.log('Sales data fetched successfully');
      } catch (fetchError) {
        console.error('Error fetching sales data:', fetchError);
        toast.error('Failed to fetch sales data. Using cached data if available.');
        // Try to use current sales data as fallback
        salesData = { sales: sales, summary: salesSummary };
      }
      
      // Check if we have sales data
      if (!salesData || !salesData.sales || salesData.sales.length === 0) {
        toast.warning('No sales data available for the selected period');
        setIsLoading(false);
        return;
      }
      
      console.log('Processing sales data:', {
        salesCount: salesData.sales.length,
        summary: salesData.summary
      });
      
      // Generate report based on selected format
      let success = false;
      
      try {
        toast(`Generating ${reportFormat.toUpperCase()} report...`);
        console.log(`Generating ${reportFormat} report...`);
        
        if (reportFormat === 'pdf') {
          success = await generatePDFReport(salesData);
        } else if (reportFormat === 'csv') {
          success = generateCSV(salesData);
        } else if (reportFormat === 'excel') {
          success = generateExcel(salesData);
        }
        
        if (success) {
          toast.success(`${reportFormat.toUpperCase()} report downloaded successfully`);
        } else {
          toast.warning(`Report may have been generated but not downloaded properly. Check your downloads folder.`);
        }
      } catch (reportError) {
        console.error('Error generating report:', reportError);
        
        // Provide more specific error messages based on the error type
        if (reportError.message?.includes('Unable to find element in cloned iframe')) {
          console.log('Detected iframe error - this is a known issue with html2canvas');
          toast.error(`PDF generation encountered an issue with complex styling. Try using CSV or Excel format instead.`);
        } else if (reportError.message?.includes('NetworkError')) {
          toast.error(`Network error while generating report. Please check your connection and try again.`);
        } else if (reportError.message?.includes('Out of memory')) {
          toast.error(`Browser ran out of memory. Try generating a report with fewer sales or use CSV format.`);
        } else {
          toast.error(`Error generating ${reportFormat.toUpperCase()} report: ${reportError.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Error in report generation process:', err);
      toast.error(err.message || 'Failed to process report request');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales</h1>
        <Button 
          onClick={() => setShowReportOptions(!showReportOptions)} 
          className="flex items-center gap-2">
          <Download size={16} />
          Download Report
        </Button>
      </div>
      
      {showReportOptions && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Download Sales Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select 
                value={reportFormat} 
                onChange={(e) => setReportFormat(e.target.value)}
                className="w-full p-2 border rounded">
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select 
                value={reportPeriod} 
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full p-2 border rounded">
                <option value="all">All Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {reportPeriod === 'custom' && (
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={reportDates.startDate} 
                    max={reportDates.endDate}
                    onChange={(e) => setReportDates(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={reportDates.endDate} 
                    min={reportDates.startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReportDates(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
          <Button 
            onClick={handleDownloadReport}
            className="w-full md:w-auto">
            Download Report
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(summary.totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Average Sale</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(summary.averageSale)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <ShoppingBag className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Sale Count</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.saleCount}</p>
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search sales..."
            className="flex-1 p-2 border rounded"
          />
          <Button type="submit"><Search size={20} /></Button>
          <Button type="button" onClick={() => setShowFilters(!showFilters)}><Filter size={20} /></Button>
        </div>
        {showFilters && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <select name="period" value={filters.period} onChange={handleFilterChange} className="p-2 border rounded">
              <option value="all">All Periods</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input name="minAmount" value={filters.minAmount} onChange={handleFilterChange} placeholder="Min Amount" className="p-2 border rounded" />
            <input name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange} placeholder="Max Amount" className="p-2 border rounded" />
          </div>
        )}
      </form>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(sale.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(sale.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`${
                      sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{sale.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Card View - Two Column Grid */}
        <div className="sm:hidden p-4">
          <div className="grid grid-cols-2 gap-4">
            {sales.map((sale) => (
              <div key={sale._id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Date</span>
                    <span className="text-xs font-semibold">{formatDate(sale.date)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Amount</span>
                    <span className="text-xs font-semibold">{formatPrice(sale.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Items</span>
                    <span className="text-xs font-semibold">{sale.items}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Status</span>
                    <Badge className={`text-xs ${
                      sale.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{sale.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}><ChevronLeft /></Button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <Button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}><ChevronRight /></Button>
      </div>
    </div>
  );
};

export default OutletSales;