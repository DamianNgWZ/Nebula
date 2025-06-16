/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BusinessSchedulerSettings() {
  const [config, setConfig] = useState({
    duration_minutes: 60,
    interval_minutes: 30,
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    available_days_in_future: 30,
    min_booking_notice: 24,
  });

  const [shopInfo, setShopInfo] = useState<any>(null);

  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const res = await fetch('/api/shop/check');
        if (res.ok) {
          const data = await res.json();
          setShopInfo(data);
        }
      } catch (error) {
        console.error("Error fetching shop info:", error);
      }
    };

    fetchShopInfo();
  }, []);

  const updateSchedulerSettings = async () => {
    try {
      const response = await fetch('/api/business/scheduler-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        alert("Scheduler settings updated successfully!");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Business Availability Settings</h1>
        <p className="text-muted-foreground">
          Configure your booking availability and time slots. This applies to all your services.
        </p>
        {shopInfo && (
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Shop:</strong> {shopInfo.shop_name} | 
              <strong> Products:</strong> {shopInfo.product_count} services will use these settings
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Time Slot Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="duration">Meeting Duration (minutes)</Label>
              <select 
                id="duration"
                value={config.duration_minutes.toString()} 
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  duration_minutes: parseInt(e.target.value)
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div>
              <Label htmlFor="interval">Time Slot Intervals (minutes)</Label>
              <select 
                id="interval"
                value={config.interval_minutes.toString()} 
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  interval_minutes: parseInt(e.target.value)
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={config.working_hours_start}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  working_hours_start: e.target.value
                }))}
              />
            </div>

            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={config.working_hours_end}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  working_hours_end: e.target.value
                }))}
              />
            </div>

            <div>
              <Label htmlFor="future-days">Available Days in Future</Label>
              <Input
                id="future-days"
                type="number"
                value={config.available_days_in_future}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  available_days_in_future: parseInt(e.target.value)
                }))}
              />
            </div>

            <div>
              <Label htmlFor="min-notice">Minimum Booking Notice (hours)</Label>
              <Input
                id="min-notice"
                type="number"
                value={config.min_booking_notice}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  min_booking_notice: parseInt(e.target.value)
                }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={updateSchedulerSettings} size="lg" className="w-full">
        Save Scheduler Settings
      </Button>
    </div>
  );
}