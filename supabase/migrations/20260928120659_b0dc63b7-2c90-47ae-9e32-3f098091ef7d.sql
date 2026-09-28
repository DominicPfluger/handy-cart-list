update public.departments set name='Frischmarkt', image_path='departments/frischmarkt.png' where id='ce1c3f80-7b76-46ad-93c0-f984f1cbe526';
update public.departments set parent_id='ce1c3f80-7b76-46ad-93c0-f984f1cbe526', sort_order=1, image_path='departments/gemuese.png' where id='7ec14105-3f0f-4c82-a129-f4a191454f0f';
update public.departments set name='Obst & Früchte', sort_order=2, image_path='departments/fruechte.png' where id='16a9a06e-4cda-4eec-9d16-50bbd5f58506';
insert into public.departments(parent_id,name,emoji,sort_order) values ('ce1c3f80-7b76-46ad-93c0-f984f1cbe526','Frische Kräuter','🌿',3),('ce1c3f80-7b76-46ad-93c0-f984f1cbe526','Salate','🥗',4);
update public.departments set sort_order=5 where id='a8785ff5-dcd3-4f83-b2dc-d208e9e8c09f';
update public.departments set sort_order=6 where id='061ce1de-9a0d-4a70-9633-7d941dc99e80';